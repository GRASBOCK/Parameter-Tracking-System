export type Unit = {
    id: string
    name: string
    short: string
    datatype: string
}

export type Parameter = {
    id: string
    name: string
    description: string
    unit_id: string
    unit: Unit
    value: number
    date: string
    source: string
    function: string | null
}

export type Commit = {
    date: string | undefined
    sha: string
}

export type Data = {
    parameters: Map<string, Parameter>, 
    units: Map<string, Unit>
}

export function calculate_value(data: Data, fn: string): number{
    let elements = fn.split(/\W/g);
    let variables = elements.filter(s => isNaN(Number(s)))
    let filled_fn = fn
    for(const v of variables){
        const val = data.parameters.get(v)
        if(!val){
            throw Error(`Variable ${v} does not exist in parameters`)
        }
        filled_fn = filled_fn.replaceAll(v, val.value.toString())
    }
    
    return eval(filled_fn)
}